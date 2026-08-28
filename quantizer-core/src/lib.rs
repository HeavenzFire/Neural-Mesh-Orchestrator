//! Quantizer Core - Base-12 Radix Space Engine
//! Zero heap allocation, stack-only operations

/// Base-12 digit representation
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Base12Digit(u8);

impl Base12Digit {
    pub const ZERO: Self = Base12Digit(0);
    pub const ONE: Self = Base12Digit(1);
    pub const DOZEN: u8 = 12;

    pub fn new(value: u8) -> Option<Self> {
        if value < Self::DOZEN {
            Some(Base12Digit(value))
        } else {
            None
        }
    }

    pub fn value(&self) -> u8 {
        self.0
    }
}

/// Stack-allocated radix buffer (no heap)
pub struct RadixBuffer<const N: usize> {
    data: [Base12Digit; N],
    len: usize,
}

impl<const N: usize> RadixBuffer<N> {
    pub const fn new() -> Self {
        RadixBuffer {
            data: [Base12Digit::ZERO; N],
            len: 0,
        }
    }

    pub fn push(&mut self, digit: Base12Digit) -> Result<(), &'static str> {
        if self.len >= N {
            return Err("Buffer overflow");
        }
        self.data[self.len] = digit;
        self.len += 1;
        Ok(())
    }

    pub fn as_slice(&self) -> &[Base12Digit] {
        &self.data[..self.len]
    }

    pub fn len(&self) -> usize {
        self.len
    }
}

/// Convert u64 to Base-12 representation
pub fn to_base12<const N: usize>(mut value: u64) -> RadixBuffer<N> {
    let mut buffer = RadixBuffer::new();
    
    if value == 0 {
        let _ = buffer.push(Base12Digit::ZERO);
        return buffer;
    }

    while value > 0 && buffer.len() < N {
        let digit = Base12Digit::new((value % 12) as u8).unwrap();
        let _ = buffer.push(digit);
        value /= 12;
    }

    buffer
}

/// Range query iterator over radix space
pub struct RadixRangeIter<const N: usize> {
    current: u64,
    end: u64,
    _phantom: std::marker::PhantomData<[Base12Digit; N]>,
}

impl<const N: usize> RadixRangeIter<N> {
    pub fn new(start: u64, end: u64) -> Self {
        RadixRangeIter {
            current: start,
            end,
            _phantom: std::marker::PhantomData,
        }
    }
}

impl<const N: usize> Iterator for RadixRangeIter<N> {
    type Item = RadixBuffer<N>;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current >= self.end {
            return None;
        }
        let result = to_base12::<N>(self.current);
        self.current += 1;
        Some(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base12_conversion() {
        let buf = to_base12::<16>(12u64);
        assert_eq!(buf.len(), 2);
        assert_eq!(buf.as_slice()[0].value(), 0);
        assert_eq!(buf.as_slice()[1].value(), 1);
    }

    #[test]
    fn test_radix_range() {
        let mut iter = RadixRangeIter::<8>::new(0, 5);
        assert!(iter.next().is_some());
        assert!(iter.next().is_some());
        assert!(iter.next().is_some());
        assert!(iter.next().is_some());
        assert!(iter.next().is_some());
        assert!(iter.next().is_none());
    }
}
